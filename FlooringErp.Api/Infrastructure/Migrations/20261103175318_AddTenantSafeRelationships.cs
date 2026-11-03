using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlooringErp.Api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantSafeRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddUniqueConstraint(
                name: "AK_Users_TenantId_Id",
                table: "Users",
                columns: new[] { "TenantId", "Id" });

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Customers_TenantId_Id",
                table: "Customers",
                columns: new[] { "TenantId", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_RoleDefinitions_TenantId",
                table: "RoleDefinitions",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotes_TenantId_AssignedToUserId",
                table: "Quotes",
                columns: new[] { "TenantId", "AssignedToUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_Quotes_TenantId_CustomerId",
                table: "Quotes",
                columns: new[] { "TenantId", "CustomerId" });

            migrationBuilder.CreateIndex(
                name: "IX_Projects_TenantId_CustomerId",
                table: "Projects",
                columns: new[] { "TenantId", "CustomerId" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductSystems_TenantId",
                table: "ProductSystems",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Tenants_TenantId",
                table: "Customers",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductSystems_Tenants_TenantId",
                table: "ProductSystems",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Customers_TenantId_CustomerId",
                table: "Projects",
                columns: new[] { "TenantId", "CustomerId" },
                principalTable: "Customers",
                principalColumns: new[] { "TenantId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Tenants_TenantId",
                table: "Projects",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_Customers_TenantId_CustomerId",
                table: "Quotes",
                columns: new[] { "TenantId", "CustomerId" },
                principalTable: "Customers",
                principalColumns: new[] { "TenantId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_Tenants_TenantId",
                table: "Quotes",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Quotes_Users_TenantId_AssignedToUserId",
                table: "Quotes",
                columns: new[] { "TenantId", "AssignedToUserId" },
                principalTable: "Users",
                principalColumns: new[] { "TenantId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RoleDefinitions_Tenants_TenantId",
                table: "RoleDefinitions",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Tenants_TenantId",
                table: "Users",
                column: "TenantId",
                principalTable: "Tenants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Tenants_TenantId",
                table: "Customers");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductSystems_Tenants_TenantId",
                table: "ProductSystems");

            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Customers_TenantId_CustomerId",
                table: "Projects");

            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Tenants_TenantId",
                table: "Projects");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotes_Customers_TenantId_CustomerId",
                table: "Quotes");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotes_Tenants_TenantId",
                table: "Quotes");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotes_Users_TenantId_AssignedToUserId",
                table: "Quotes");

            migrationBuilder.DropForeignKey(
                name: "FK_RoleDefinitions_Tenants_TenantId",
                table: "RoleDefinitions");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Tenants_TenantId",
                table: "Users");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Users_TenantId_Id",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_RoleDefinitions_TenantId",
                table: "RoleDefinitions");

            migrationBuilder.DropIndex(
                name: "IX_Quotes_TenantId_AssignedToUserId",
                table: "Quotes");

            migrationBuilder.DropIndex(
                name: "IX_Quotes_TenantId_CustomerId",
                table: "Quotes");

            migrationBuilder.DropIndex(
                name: "IX_Projects_TenantId_CustomerId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_ProductSystems_TenantId",
                table: "ProductSystems");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Customers_TenantId_Id",
                table: "Customers");
        }
    }
}
